import { z } from "zod";

// Zod schema for validation of journal lines in BKU
const journalLineSchema = z.object({
  accountCode: z.string().min(1, "Kode akun harus diisi."),
  type: z.enum(["DEBIT", "CREDIT"], {
    message: "Tipe jurnal harus DEBIT atau CREDIT.",
  }),
  amount: z.coerce.number().positive("Nominal harus lebih besar dari 0."),
});

// Zod schema for BKU (Cash Book) Entry creation
export const bkuEntrySchema = z.object({
  date: z.string().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    { message: "Format tanggal tidak valid." }
  ),
  description: z.string()
    .min(3, "Keterangan transaksi minimal 3 karakter.")
    .max(255, "Keterangan transaksi maksimal 255 karakter."),
  unitUsaha: z.enum(["SP", "GEDUNG", "LAHAN", "PPOB", "UMUM"], {
    message: "Unit usaha tidak valid.",
  }),
  attachmentUrl: z.string().nullable().optional(),
  proofNumber: z.string().nullable().optional(),
  proofType: z.enum(["BKM", "BKK", "MEMORIAL"]).nullable().optional(),
  payeeOrPayer: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  verificationStatus: z.enum(["DRAFT", "PRINTED", "SIGNED_UPLOADED", "VERIFIED"]).optional(),
  lines: z.array(
    z.object({
      accountCode: z.string().min(1, "Kode akun harus diisi."),
      type: z.enum(["DEBIT", "CREDIT"], {
        message: "Tipe jurnal harus DEBIT atau CREDIT.",
      }),
      amount: z.coerce.number().positive("Nominal harus lebih besar dari 0."),
      cashFlowGroup: z.string().nullable().optional(),
    })
  )
    .min(2, "Transaksi minimal harus memiliki 2 baris jurnal (Debit & Kredit)."),
}).refine(
  (data) => {
    const debitTotal = data.lines
      .filter((l) => l.type === "DEBIT")
      .reduce((sum, l) => sum + l.amount, 0);
    const creditTotal = data.lines
      .filter((l) => l.type === "CREDIT")
      .reduce((sum, l) => sum + l.amount, 0);
    
    // Check for equality with absolute difference tolerance of 0.01 for decimals
    return Math.abs(debitTotal - creditTotal) < 0.01;
  },
  {
    message: "Total Debit harus seimbang (sama dengan) dengan total Kredit.",
    path: ["lines"], // Attach error to the lines field
  }
);

// Zod schema for Fixed Asset creation
export const assetSchema = z.object({
  date: z.string().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)),
    { message: "Format tanggal tidak valid." }
  ),
  name: z.string()
    .min(3, "Nama aset minimal 3 karakter.")
    .max(255, "Nama aset maksimal 255 karakter."),
  purchaseCost: z.coerce.number().positive("Harga perolehan harus lebih besar dari 0."),
  economicLife: z.coerce.number().int("Umur ekonomis harus berupa angka bulat.").positive("Umur ekonomis harus lebih besar dari 0."),
});
