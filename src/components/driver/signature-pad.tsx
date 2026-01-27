'use client';

import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Eraser, Check } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signatureUrl: string) => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);

  const clear = () => {
    sigCanvas.current?.clear();
  };

  const save = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert('Tanda tangan masih kosong!');
      return;
    }
    const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (dataUrl) {
      onSave(dataUrl);
    }
  };

  return (
    <div className="flex flex-col gap-4 border p-4 rounded-lg bg-white shadow-sm">
      <p className="text-sm font-medium text-gray-700">Tanda Tangan Pelanggan:</p>
      <div className="border-2 border-dashed border-gray-300 rounded-md overflow-hidden bg-gray-50">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: 'signature-canvas w-full h-48',
          }}
          backgroundColor="rgba(0,0,0,0)"
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 gap-2"
          onClick={clear}
        >
          <Eraser size={16} />
          Hapus
        </Button>
        <Button
          type="button"
          className="flex-1 gap-2 bg-sage-600 hover:bg-sage-700"
          onClick={save}
        >
          <Check size={16} />
          Simpan
        </Button>
      </div>
    </div>
  );
};
