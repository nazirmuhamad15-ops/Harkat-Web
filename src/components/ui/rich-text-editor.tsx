'use client'

import React, { forwardRef } from 'react'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import type { MDXEditorMethods } from '@mdxeditor/editor'

const Editor = dynamic(
  () => import('./mdx-editor'), 
  { 
    ssr: false, 
    loading: () => <Skeleton className="h-[200px] w-full rounded-md" /> 
  }
)

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export const RichTextEditor = forwardRef<MDXEditorMethods, RichTextEditorProps>((props, ref) => {
  return <Editor markdown={props.value} onChange={props.onChange} editorRef={ref} placeholder={props.placeholder} />
})

RichTextEditor.displayName = 'RichTextEditor'
