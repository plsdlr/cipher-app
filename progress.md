# Re-Cipher Circuit Issue

## Problem
The `EnsureOnlyOneValueChanged` circuit template counts individual byte-level changes, not parameter-level changes.

## Current Behavior
- Changing a turmite gene (12 bytes) = **12 changes detected** → Circuit fails
- Changing a coordinate (1 byte) = **1 change detected** → Circuit passes
- Changing color (4 bits) = **1 change detected** → Circuit passes
- Changing animation param (1 byte) = **1 change detected** → Circuit passes

## Root Cause
Each turmite gene is 24 hex chars (12 bytes = 96 bits). The circuit breaks down rulesets into individual bytes when comparing, so one gene change = 12 byte changes.

## Solution Options

### Option 1: Update Circuit (Recommended)
Modify `EnsureOnlyOneValueChanged` to count changes at the **parameter level**:
- Each complete turmite gene = 1 unit
- Each coordinate byte = 1 unit
- Each metadata byte = 1 unit
- Color nibble = 1 unit

### Option 2: Restrict UI (Temporary)
Only allow re-cipher for single-byte parameters:
- ✅ Coordinates (x/y individually)
- ✅ Animation params
- ✅ Color
- ❌ Turmite genes (disabled)

## Status
Circuit validation works correctly. Keys and encryption verified. Issue isolated to change-counting granularity.


Done! I've created a concise progress.md documenting the issue. It explains that the circuit counts byte-level changes instead of parameter-level changes, so changing a 12-byte turmite gene registers as 12 changes instead of 1. The circuit needs to be updated to count at the parameter level rather than byte level. 