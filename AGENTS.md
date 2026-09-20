<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Peraturan UI Kasih Bersama

Peraturan ini mengikat. Kod yang melanggarnya ialah pepijat, bukan gaya.

## 1. Setiap senarai rekod ialah `DataTable`

Mana-mana skrin yang memaparkan senarai rekod - ahli circle, jemputan, peti masuk
pemberitahuan, sesi, peranti - menggunakan `components/data-table.tsx`
(TanStack Table v9 + shadcn), bukan `Item`/`ItemGroup`, bukan `<ul>`, dan bukan
jadual tulis tangan.

```tsx
const helper = createDataTableColumnHelper<Row>()
const columns = helper.columns([
  helper.accessor("name", { header: "Nama" }),
  helper.display({
    id: "action",
    header: () => <span className="flex justify-end">Tindakan</span>,
    enableSorting: false,
    cell: ({ row }) => (
      <TableActions>
        <TableActionButton onPress={...}>Buang</TableActionButton>
      </TableActions>
    ),
  }),
])

<DataTable
  columns={columns}
  data={rows}
  getRowId={(row) => row.id}
  isLoading={...}
  errorMessage={error ? messageForApiError(error) : undefined}
  onRetry={() => void reload()}
  emptyIcon={<IconX />}
  emptyTitle="..."
  emptyDescription="..."
/>
```

Sebabnya: keadaan memuat, keadaan ralat, keadaan kosong, carian, tapisan, susunan
dan penomboran sudah ada di dalamnya. Setiap senarai tulis tangan bermakna satu
lagi salinan kelima-lima keadaan itu, dan setiap salinan terlupa sekurang-kurangnya
satu daripadanya.

- Lajur tindakan: `TableActions` + `TableActionButton` (`components/table-actions.tsx`).
- Tapisan lajur perlukan `filterFn: "equalsString"` pada lajur itu.
- **Jangan** balut `DataTable` dalam `Card` - ia membawa bekasnya sendiri. Tajuk
  bahagian masuk melalui `toolbarStart`.
- **Jangan** guna `useMemo` untuk lajur. React Compiler aktif dalam repo ini dan
  akan melangkau komponen yang memoization manualnya tidak dapat dikekalkan.

Pengecualian: paparan yang BUKAN senarai rekod - kad tetapan, borang, keutamaan
kategori × saluran - kekal sebagai `Card`/`Field`.

## 2. Setiap primitif UI datang daripada shadcn

Import daripada `components/ui/*` sahaja. Tiada `<button>`, `<input>`, `<table>`,
`<select>`, `<dialog>` HTML mentah dalam kod ciri; tiada pustaka UI kedua. Kalau
primitif belum ada, tambah melalui `npx shadcn@latest add <nama>` dan bukan dengan
menulisnya sendiri.

`<div>`, `<p>`, `<span>`, `<ul>` untuk susun atur dan teks memang dibenarkan - yang
dilarang ialah kawalan interaktif dan bekas yang sudah ada padanan shadcn.
