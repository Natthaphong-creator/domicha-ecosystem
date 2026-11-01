# Owner manual documents

Open `owner.html#manual` and sign in with the linked brand owner. All manual
operations require that exact verified identity and the server-stored Admin
role; payment reviewers and customers cannot use them.

1. Create a quotation or invoice. Choose an existing active franchise member
   (name and branch only are used to assist entry), or enter an external buyer.
   Enter billing address and optional phone/tax ID. Nothing creates a login.
2. Choose stock catalogue entries as typing assistance, enter custom lines, or
   choose one franchise package. The initial user-approved package prices are
   M THB 39,000; L THB 69,000; XL THB 89,000. Each is one quantity-one line;
   no underlying ingredient breakdown or inventory mutation is performed.
3. Preview and explicitly approve the details before saving. The server assigns
   the document number and calculates the totals in integer satang.
4. Convert a quotation to one invoice. Repeating this returns the same invoice.
   Prices and buyer/seller snapshots remain as quoted, even if templates change.
5. On the invoice, enter the exact amount, actual receipt time and payment
   method. Cash requires counted funds; transfer/PromptPay require the bank
   transaction reference. Explicit confirmation issues one receipt and queues
   the existing private Drive archive and owner LINE notification.

Quotations/invoices are stored in the private database, can be reopened from
manual history, and printed/saved as PDF with original/accounting copies.
Receipt PDFs are archived automatically through the existing worker. Neither
quotation creation nor invoice conversion sends a payment notification.
Unpaid documents may be cancelled; cancellation is labelled on printed copies.
Issued documents are immutable. Paid documents cannot use unpaid cancellation.
No VAT invoices are issued by this feature. No old inventory quantities are
changed. Package settings apply only to future documents.

External buyers get stable internal folder IDs from their normalized billing
identity and branch name; selecting an existing member uses their existing
customer/branch folder IDs. Historical archive PDFs are never overwritten.
Audit records attribute document creation, conversion, package changes,
cancellation and receipt confirmation to the owner.

Validation: frontend/API authorization and money tests, database tests executed
as service_role inside transactions ending in ROLLBACK, and an isolated browser
fixture. No real payment was confirmed or test LINE sent during these checks.
