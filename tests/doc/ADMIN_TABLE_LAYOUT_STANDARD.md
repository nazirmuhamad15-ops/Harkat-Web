# Admin Table Layout Standard

## Design Principles
1. **Freeze Header**: Table header harus sticky untuk navigasi mudah
2. **Minimal Header**: Header kompak dengan spacing minimal
3. **Maximize Table Area**: Full viewport height dengan flex layout
4. **Consistent Spacing**: Padding minimal tapi tetap readable

## Layout Structure

```tsx
<div className="h-full flex flex-col">
  {/* HEADER SECTION - Minimal & Compact */}
  <div className="flex flex-col bg-white border-b border-stone-200">
    
    {/* Row 1: Title, Stats & Actions */}
    <div className="flex items-center justify-between px-3 py-2 border-b border-stone-100">
      <div className="flex items-center gap-4">
        <h1 className="text-base font-bold text-stone-900">Title</h1>
        <div className="h-4 w-px bg-stone-200" />
        {/* Stats or Tabs */}
      </div>
      <div className="flex items-center gap-2">
        {/* Action Buttons */}
      </div>
    </div>

    {/* Row 2: Search & Filters */}
    <div className="flex items-center justify-between px-3 py-2 bg-stone-50/50">
      {/* Search & Filter Controls */}
    </div>
  </div>

  {/* TABLE SECTION - Maximized */}
  <div className="flex-1 overflow-auto">
    <Table>
      <TableHeader className="sticky top-0 bg-white z-10 border-b">
        {/* Headers */}
      </TableHeader>
      <TableBody>
        {/* Rows */}
      </TableBody>
    </Table>
  </div>
</div>
```

## Key CSS Classes

### Container
- `h-full flex flex-col` - Full height with flex column

### Header
- `px-3 py-2` - Minimal padding (was px-4 py-3)
- `text-base` - Smaller title (was text-2xl)
- `h-7` or `h-8` - Compact button heights
- `text-xs` - Smaller text sizes

### Table Header (Freeze)
- `sticky top-0 z-10 bg-white border-b` - Sticky header
- `font-semibold` - Bold headers

### Table Container
- `flex-1 overflow-auto` - Scrollable table area
- Remove Card padding: `p-0`

## Component Sizes

### Buttons
- Small: `h-7 text-xs px-2`
- Icon: `h-7 w-7`

### Inputs
- Height: `h-8`
- Text: `text-xs`

### Badges
- Text: `text-xs`

### Icons
- Small: `w-3.5 h-3.5`
- Regular: `w-4 h-4`

## Pages to Update

1. ✅ **Orders** - Already done (reference)
2. ✅ **Products** - Already has freeze header
3. ⏳ **Categories** - Need to update
4. ⏳ **Stock** - Need to update  
5. ⏳ **Order History** - Need to update
6. ⏳ **Users** - Need to update

## Example: Minimal Header

```tsx
{/* Compact Header */}
<div className="flex items-center justify-between px-3 py-2 border-b border-stone-100">
  <div className="flex items-center gap-4">
    <h1 className="text-base font-bold text-stone-900">Users</h1>
    <div className="h-4 w-px bg-stone-200" />
    <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-md border border-stone-100">
      <Users className="w-3.5 h-3.5 text-blue-600" />
      <div>
        <p className="text-[10px] text-stone-500 font-medium uppercase leading-none">Total</p>
        <p className="text-xs font-bold text-stone-900 leading-none mt-0.5">{stats.total}</p>
      </div>
    </div>
  </div>
  <div className="flex items-center gap-2">
    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refresh}>
      <RefreshCw className="w-3.5 h-3.5" />
    </Button>
    <Button size="sm" className="h-7 text-xs px-3" onClick={handleAdd}>
      <Plus className="w-3.5 h-3.5 mr-1.5" />
      Add
    </Button>
  </div>
</div>
```

## Freeze Header Implementation

```tsx
{/* Table with Sticky Header */}
<div className="flex-1 overflow-auto">
  <Table>
    <TableHeader className="sticky top-0 bg-white z-10 border-b">
      <TableRow>
        <TableHead className="font-semibold">Column 1</TableHead>
        <TableHead className="font-semibold">Column 2</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {/* Data rows */}
    </TableBody>
  </Table>
</div>
```

## Before vs After

### Before (Old Style)
```tsx
<div className="space-y-6 p-4">
  <div className="flex items-center justify-between">
    <h1 className="text-2xl font-bold">Title</h1>
    <Button>Action</Button>
  </div>
  <Card>
    <CardContent className="p-6">
      <Table>
        {/* No sticky header */}
      </Table>
    </CardContent>
  </Card>
</div>
```

### After (New Style)
```tsx
<div className="h-full flex flex-col">
  <div className="flex flex-col bg-white border-b border-stone-200">
    <div className="flex items-center justify-between px-3 py-2">
      <h1 className="text-base font-bold">Title</h1>
      <Button size="sm" className="h-7">Action</Button>
    </div>
  </div>
  <div className="flex-1 overflow-auto">
    <Table>
      <TableHeader className="sticky top-0 bg-white z-10 border-b">
        {/* Sticky! */}
      </TableHeader>
    </Table>
  </div>
</div>
```

## Benefits

1. ✅ **More Data Visible** - Less wasted space
2. ✅ **Better UX** - Sticky headers for easy navigation
3. ✅ **Consistent** - Same pattern across all pages
4. ✅ **Modern** - Clean, minimal design
5. ✅ **Responsive** - Works on all screen sizes
