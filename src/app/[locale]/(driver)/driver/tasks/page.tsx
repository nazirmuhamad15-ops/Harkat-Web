'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Truck, Package, MapPin, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface DriverTask {
    id: string
    status: string
    order: {
        orderNumber: string
        customerName: string
        shippingAddress: string
        items: Array<{productName: string, quantity: number}>
    }
}

export default function MyTasksPage() {
    const router = useRouter()
    const [tasks, setTasks] = useState<DriverTask[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchTasks()
    }, [])

    const fetchTasks = async () => {
        try {
            const res = await fetch('/api/driver/tasks')
            if (res.ok) {
                const data = await res.json()
                setTasks(data.data)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const filteredTasks = tasks.filter(t => 
        t.order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        t.order.customerName.toLowerCase().includes(search.toLowerCase()) ||
        t.order.shippingAddress.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">My Tasks</h1>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                    placeholder="Search tasks..." 
                    className="pl-10"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {loading ? (
                <div>Loading tasks...</div>
            ) : filteredTasks.length === 0 ? (
                <div className="text-center text-gray-500 py-10">No tasks found.</div>
            ) : (
                <div className="grid gap-4">
                    {filteredTasks.map(task => (
                        <Card key={task.id} className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => router.push(`/driver/tasks/${task.id}`)}>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-lg">{task.order.orderNumber}</span>
                                        <span className="text-sm text-gray-600">{task.order.customerName}</span>
                                    </div>
                                    <Badge variant={task.status === 'DELIVERED' ? 'default' : 'secondary'}>
                                        {task.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                                <div className="flex items-center text-gray-600 text-sm mb-2">
                                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                                    <span className="truncate">{task.order.shippingAddress}</span>
                                </div>
                                <div className="flex items-center text-gray-600 text-sm">
                                    <Package className="w-4 h-4 mr-1 flex-shrink-0" />
                                    <span>{task.order.items.length} items</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
