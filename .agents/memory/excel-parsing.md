---
name: SIGMON Excel file layout
description: Header row at index 2, data starts row 4; column indices for BOD monitoring data
---

## File Structure

- Row 0: blank / merged cells  
- Row 1: blank / merged cells
- Row 2 (index 2): Main headers — WILAYAH, REGION, AREA, (cabang_id), UNIT, ...
- Row 3 (index 3): Sub-headers  
- Row 4+: Data rows

## Detection

Scan rows until a row contains "WILAYAH", "REGION", and "UNIT" — that is header_row.  
sub_header_row = header_row + 1, data_start = sub_header_row + 1.

## Column Mapping (0-based)

- 0: wilayah, 1: region, 2: area, 3: cabang_id, 4: unit
- 18–29: BOD data (noa, noc, os_aktif, lending, noa_par, os_par, noa_npl, os_npl, os_3r, noa_lar, os_lar, pct_rr)
- 46–48: target RKAP (target_noc, target_os, target_lending)
- 52–54: gap (gap_noc, gap_os, gap_lending)
- 58–60: % pencapaian (pct_noc, pct_os, pct_lending)
- 62: pct_os_npl
- 65: ao

**Why:** The Excel file from Cabang Tangerang has a fixed layout with merged cells for headers.
