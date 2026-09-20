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
- **Status ialah lajurnya sendiri**, bukan lencana yang disumbat ke dalam lajur nama.
  Ia ditapis (`filterFn: "equalsString"`) dan dirender dengan `StatusChip` (peraturan 3).
- Butang **Tambah** dan menu **Lajur** datang daripada jadual itu sendiri: hantar
  `onAdd` dan `addLabel`, dan ia muncul sebagai satu `ButtonGroup` di KANAN, sebaris
  dengan medan carian. Jangan bina butang itu sendiri di atas jadual - dua jadual yang
  meletakkannya di dua tempat memaksa pembaca mencari.
  `showColumnToggle={false}` hanya bila setiap lajur wajib dilihat. Lajur `action`
  tidak pernah boleh disembunyikan.
- **Jangan** balut `DataTable` dalam `Card` - ia membawa bekasnya sendiri. Tajuk
  bahagian masuk melalui `toolbarStart`.
- **Jangan** guna `useMemo` untuk lajur. React Compiler aktif dalam repo ini dan
  akan melangkau komponen yang memoization manualnya tidak dapat dikekalkan.

Pengecualian: paparan yang BUKAN senarai rekod - kad tetapan, borang, keutamaan
kategori × saluran - kekal sebagai `Card`/`Field`.

## 2. Borang dalam dialog guna `ResponsiveDialog`

Setiap borang yang dibuka dari butang - cipta circle, jemput ahli, sunting person,
urus akses - guna `components/responsive-dialog.tsx`. Ia modal berpusat pada desktop
dan sheet bawah pada telefon.

```tsx
<ResponsiveDialog
  isOpen={isOpen}
  onOpenChange={setIsOpen}
  title="Cipta circle"
  description="Anda menjadi pemilik."
  footer={
    <>
      <Button variant="outline" onPress={() => setIsOpen(false)}>
        Batal
      </Button>
      <Button isDisabled={isSaving} onPress={() => void save()}>
        Cipta
      </Button>
    </>
  }
>
  <Field>…</Field>
</ResponsiveDialog>
```

Modal berpusat pada skrin kecil meletakkan borang di bawah papan kekunci dan di atas
ibu jari; sheet tidak. Pilihan itu milik komponen ini, bukan setiap pemanggil - pemanggil
yang kena ingat ialah pemanggil yang akan terlupa.

Pengesahan MUSNAH (padam, buang ahli, tarik balik) tetap `ConfirmDialog`: ia soalan
ya/tidak, bukan borang.

## 3. Satu cip status untuk seluruh app

`StatusChip` (`components/status-chip.tsx`) dengan empat nada, dinamakan mengikut MAKNA
dan bukan warna: `positive` (aktif, dipercayai), `neutral` (dibaca, tamat), `attention`
(menunggu, belum dibaca), `critical` (digantung, ditolak).

Jangan render `Badge` mentah untuk status. Tanpa cip yang dikongsi, "aktif" jadi hijau
dalam satu jadual dan kelabu dalam jadual seterusnya, dan pembaca terpaksa belajar
setiap jadual secara berasingan. `Badge` masih betul untuk label BUKAN status (kiraan,
jenis, tag).

## 4. Setiap primitif UI datang daripada shadcn

Import daripada `components/ui/*` sahaja. Tiada `<button>`, `<input>`, `<table>`,
`<select>`, `<dialog>` HTML mentah dalam kod ciri; tiada pustaka UI kedua. Kalau
primitif belum ada, tambah melalui `npx shadcn@latest add <nama>` dan bukan dengan
menulisnya sendiri.

`<div>`, `<p>`, `<span>`, `<ul>` untuk susun atur dan teks memang dibenarkan - yang
dilarang ialah kawalan interaktif dan bekas yang sudah ada padanan shadcn.
