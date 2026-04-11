import { NextRequest } from 'next/server'
import { verifyToken } from './jwt'
import { prisma } from './prisma'

export async function authenticate(request: NextRequest) {
  try {
    const authHeader = 
      request.headers.get('authorization') || 
      request.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'No token provided', status: 401, user: null }
    }

    const token = authHeader.substring(7).trim()

    if (!token) {
      return { error: 'Token is empty', status: 401, user: null }
    }

    const decoded = verifyToken(token)

    if (!decoded) {
      return { error: 'Invalid or expired token', status: 401, user: null }
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        profilePic: true,
        isVerified: true,
        isOnline: true
      }
    })

    if (!user) {
      return { error: 'User not found', status: 401, user: null }
    }

    if (!user.isVerified) {
      return { error: 'Email not verified', status: 403, user: null }
    }

    return { user, error: null, status: 200 }

  } catch (error) {
    console.error('Auth error:', error)
    return { error: 'Authentication failed', status: 500, user: null }
  }
}
