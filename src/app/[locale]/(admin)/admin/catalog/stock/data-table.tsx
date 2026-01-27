"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, SlidersHorizontal, Download } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey: string
  onExport?: () => void
  bulkActions?: (selectedRows: TData[]) => React.ReactNode
  rowSelection?: any
  onRowSelectionChange?: (selection: any) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  onExport,
  bulkActions,
  rowSelection,
  onRowSelectionChange
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  // Internal state for rowSelection if not controlled from outside
  const [internalRowSelection, setInternalRowSelection] = React.useState({})
  
  // Use controlled state if provided, otherwise internal
  const selection = rowSelection !== undefined ? rowSelection : internalRowSelection
  const setSelection = onRowSelectionChange !== undefined ? onRowSelectionChange : setInternalRowSelection

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection: selection,
    },
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)

  return (
    <div className="w-full h-full flex flex-col space-y-2 p-1">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 flex-1">
            <Input
            placeholder="Search..."
            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
            />
            
            {Object.keys(selection).length > 0 && bulkActions && (
                <div className="flex items-center gap-2 ml-2 px-3 py-1.5 bg-stone-100 rounded-md border border-stone-200">
                    <span className="text-xs font-bold text-stone-600">{Object.keys(selection).length} selected</span>
                    <div className="h-4 w-px bg-stone-300 mx-1" />
                    {bulkActions(selectedRows)}
                </div>
            )}

            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                View
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                    return (
                    <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                        }
                    >
                        {column.id}
                    </DropdownMenuCheckboxItem>
                    )
                })}
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
        {onExport && (
            <Button variant="outline" onClick={onExport} className="ml-2">
                <Download className="mr-2 h-4 w-4" />
                Export
            </Button>
        )}
      </div>
      <div className="rounded-md border bg-white flex-1 overflow-auto relative">
        <table className="w-full caption-bottom text-sm">
          <TableHeader className="bg-stone-50 sticky top-0 z-10 shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-stone-50/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </table>
      </div>
      <div className="flex items-center justify-end space-x-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
