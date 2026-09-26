export function getDepartmentScope(req) {
  const role = req.user?.role;
  const department = req.user?.department;
  if (role === 'DEPARTMENT_HEAD' && department) {
    return department;
  }
  return null;
}

export function assertDepartmentAccess(req, targetDepartment) {
  const scope = getDepartmentScope(req);
  if (scope && targetDepartment !== scope) {
    const err = new Error('Cross-department access denied');
    err.status = 403;
    err.code = 'DEPARTMENT_FORBIDDEN';
    throw err;
  }
}
