'use client'

import { 
  MDXEditor, 
  headingsPlugin, 
  listsPlugin, 
  quotePlugin, 
  thematicBreakPlugin, 
  markdownShortcutPlugin, 
  toolbarPlugin, 
  UndoRedo, 
  BoldItalicUnderlineToggles, 
  BlockTypeSelect, 
  ListsToggle,
  linkPlugin,
  LinkDialog,
  CreateLink,
  imagePlugin,
  InsertImage
} from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import type { MDXEditorMethods } from '@mdxeditor/editor'
import { RefObject } from 'react'

interface EditorProps {
  markdown: string
  onChange?: (markdown: string) => void
  editorRef?: RefObject<MDXEditorMethods>
  placeholder?: string
}

export default function MdxEditor({ markdown, onChange, editorRef, placeholder }: EditorProps) {
  return (
    <div className="border rounded-md bg-white overflow-hidden shadow-sm rich-text-editor">
      <MDXEditor
        ref={editorRef}
        markdown={markdown || ''}
        placeholder={placeholder}
        onChange={onChange}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          linkPlugin(),
          imagePlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <span className="w-px h-4 bg-gray-200 mx-2" />
                <BlockTypeSelect />
                <span className="w-px h-4 bg-gray-200 mx-2" />
                <BoldItalicUnderlineToggles />
                <span className="w-px h-4 bg-gray-200 mx-2" />
                <ListsToggle />
                <span className="w-px h-4 bg-gray-200 mx-2" />
                <CreateLink />
                {/* <InsertImage /> - Images are handled separately via upload usually, but keeping text features */}
              </>
            )
          })
        ]}
        contentEditableClassName="prose-sm max-w-none p-4 min-h-[200px] outline-none text-stone-800"
      />
      <style jsx global>{`
        .rich-text-editor ul { list-style-type: disc; padding-left: 1.5rem; }
        .rich-text-editor ol { list-style-type: decimal; padding-left: 1.5rem; }
        .rich-text-editor h1 { font-size: 2em; font-weight: bold; margin-bottom: 0.5em; }
        .rich-text-editor h2 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.5em; }
        .rich-text-editor h3 { font-size: 1.17em; font-weight: bold; margin-bottom: 0.5em; }
        .rich-text-editor blockquote { border-left: 4px solid #e5e7eb; padding-left: 1rem; color: #6b7280; font-style: italic; }
      `}</style>
    </div>
  )
}
