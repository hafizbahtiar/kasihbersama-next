import type { ResourceSchema } from "@/lib/domain/resource"

export const resourceCatalog: ResourceSchema[] = [
  {
    slug: "notifications",
    title: "Notifikasi",
    singular: "Notifikasi",
    description: "Peringatan penjaga dan pengumuman admin.",
    fields: [
      { name: "name", label: "Tajuk", type: "text" },
      { name: "detail", label: "Perincian", type: "textarea" },
      { name: "time", label: "Masa", type: "text" },
      {
        name: "audience",
        label: "Sisi",
        type: "select",
        options: [
          { label: "Pengguna", value: "Pengguna" },
          { label: "Admin", value: "Admin" },
        ],
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "Baharu", value: "Baharu" },
          { label: "Dibaca", value: "Dibaca" },
        ],
      },
    ],
  },
]
