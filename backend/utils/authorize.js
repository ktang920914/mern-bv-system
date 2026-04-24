import { errorHandler } from './error.js'

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(errorHandler(401, 'Unauthorized'))
    }

    const normalizedUserRole = String(req.user.role || '').toLowerCase()
    const normalizedAllowedRoles = allowedRoles.map((role) =>
      String(role).toLowerCase()
    )

    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      return next(errorHandler(403, 'Forbidden'))
    }

    next()
  }
}
