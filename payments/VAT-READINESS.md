# Future VAT invoices

Current delivery: a separately labelled, synthetic invoice preview at
`tax-invoice-preview.html`, linked from the owner's payment and receipt settings.
It does not access orders, issue document numbers, change existing receipts,
calculate actual order VAT, or enqueue Drive/LINE delivery. The example uses a
7% illustrative rate and assumes one taxable rate for goods and delivery.
Both original and accounting copy retain the same demonstration reference.

Before enabling production issuance after VAT registration:

- Verify the effective registration date and seller's legal name, address,
  taxpayer ID and establishment code against ภ.พ.20.
- Establish inclusive/exclusive catalogue prices, tax category per item,
  delivery treatment, discounts and rounding rules with accounting.
- Collect buyer legal name/address and required taxpayer/establishment details.
- Implement independent server-generated invoice numbers and immutable tax
  snapshots with effective-dated rate and registration checks. Do not retrofit
  historical receipts into tax invoices.
- Support the tax point independently of payment confirmation, including
  deliveries before payment. A combined receipt/invoice applies only when the
  corresponding events are appropriate; do not tie all tax invoices to cash
  receipt.
- Implement original/copy PDF archival, audit, corrective documents and tax
  reports; verify concurrent issuance and idempotency before release.
- Separately decide whether to enroll in e-Tax Invoice/e-Receipt; ordinary
  PDFs and Google Drive archival do not provide that enrollment.

Primary reference: https://www.rd.go.th/5208.html (sections 86 and 86/4).
The preview is preparatory work and is not a completed VAT issuance engine.
