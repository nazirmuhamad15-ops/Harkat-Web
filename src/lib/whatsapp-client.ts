import 'server-only'

import makeWASocket, { 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore,
    WASocket,
    ConnectionState
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import path from 'path'

// Global variable to maintain socket connection across reloads in dev
let wasock: WASocket | undefined = undefined
let qrCode: string | undefined = undefined
let connectionStatus: string = 'disconnected'
let isConnecting: boolean = false

export const getWhatsAppStatus = () => {
    return {
        status: connectionStatus,
        qr: qrCode,
        user: wasock?.user
    }
}

export const connectToWhatsApp = async () => {
    // Prevent multiple simultaneous connection attempts
    if (isConnecting) {
        console.log('Already connecting...')
        return wasock
    }
    
    if (wasock && connectionStatus === 'connected') {
        console.log('Already connected')
        return wasock
    }

    isConnecting = true
    connectionStatus = 'connecting'

    try {
        const authPath = path.resolve(process.cwd(), 'prisma', 'whatsapp_auth_baileys')
        const { state, saveCreds } = await useMultiFileAuthState(authPath)
        const { version, isLatest } = await fetchLatestBaileysVersion()
        
        console.log(`Using WA v${version.join('.')}, isLatest: ${isLatest}`)

        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }) as any,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }) as any),
            },
            generateHighQualityLinkPreview: true,
            // Use browser config to avoid some compatibility issues
            browser: ['Harkat Furniture', 'Chrome', '120.0.0'],
        })

        sock.ev.on('connection.update', (update: Partial<ConnectionState>) => {
            const { connection, lastDisconnect, qr } = update
            
            if (qr) {
                qrCode = qr
                connectionStatus = 'scanning'
                console.log('New WhatsApp QR Code generated')
            }

            if (connection === 'close') {
                const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut
                console.log('Connection closed, status:', statusCode, ', reconnecting:', shouldReconnect)
                connectionStatus = 'disconnected'
                qrCode = undefined
                wasock = undefined
                isConnecting = false
                
                if (shouldReconnect && statusCode !== 515) { // 515 is restart required
                    setTimeout(() => {
                        connectToWhatsApp()
                    }, 5000) // Wait 5 seconds before reconnecting
                }
            } else if (connection === 'open') {
                console.log('WhatsApp Connection Opened')
                connectionStatus = 'connected'
                qrCode = undefined
                isConnecting = false
            }
        })

        sock.ev.on('creds.update', saveCreds)

        wasock = sock
        return sock
    } catch (error) {
        console.error('WhatsApp connection error:', error)
        connectionStatus = 'disconnected'
        isConnecting = false
        throw error
    }
}

export const disconnectWhatsApp = async () => {
    if (wasock) {
        try {
            await wasock.logout()
        } catch (e) {
            console.error('Logout error:', e)
        }
        wasock = undefined
        connectionStatus = 'disconnected'
        qrCode = undefined
        isConnecting = false
    }
}

export const sendMessage = async (jid: string, message: string) => {
    if (!wasock || connectionStatus !== 'connected') {
        throw new Error('WhatsApp not connected')
    }
    
    return await wasock.sendMessage(jid, { text: message })
}

