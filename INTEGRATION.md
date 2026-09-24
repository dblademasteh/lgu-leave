# LGU Leave ↔ HRMS ↔ Attendance Integration

## Overview
Leave system feeds leave applications to HRMS on creation and feeds approved leaves to Attendance system for monitoring.

## Flow
1. Employee creates leave request → `POST /api/v1/leaves`
   - Outbound sync to HRMS: `POST {HRMS_BASE_URL}/integrations/leaves/application`
   - Payload: employeeNumber, leaveType, startDate, endDate, days, status PENDING, reason
2. Approver approves → `POST /api/v1/leaves/:id/approve`
   - Balance is decremented
   - Outbound sync to Attendance: `POST {ATTENDANCE_WEBHOOK_URL}`
   - Payload: employeeNumber, leaveType, startDate, endDate, days, status APPROVED

## Settings
Configure in Settings UI:
- HRMS Integration: Base URL, API Key, Enable sync
- Attendance Sync: Enable, Webhook URL, Poll Interval

Stored in `SystemSetting` table:
- HRMS_BASE_URL
- HRMS_API_KEY
- HRMS_ENABLED
- ATTENDANCE_ENABLED
- ATTENDANCE_WEBHOOK_URL
- ATTENDANCE_POLL_INTERVAL

## Backend Routes
- `GET /api/v1/settings/system`
- `PATCH /api/v1/settings/system`
- `POST /api/v1/leaves` → triggers HRMS outbound
- `POST /api/v1/leaves/:id/approve` → triggers Attendance outbound

## Sync Logs
All outbound attempts logged to `SyncLog` table:
- direction OUTBOUND
- source API
- entity LeaveRequest
- status SUCCESS/FAILED

## Testing
1. Configure HRMS and Attendance settings
2. Create leave request as employee 1001
3. Approve as HR_MANAGER/ADMIN
4. Check SyncLog for outbound entries

## CSC Compliance
Leave types seeded: VL, SL, SIL, MATERNITY, PATERNITY, SOLO_PARENT, ADOPTION, BEREAVEMENT, STUDY, LWOP
Rules managed via Settings → Leave Rules
Office hours and holidays managed via Settings
