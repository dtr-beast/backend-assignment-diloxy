import { Request, Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import httpStatus from 'http-status'
import { prisma } from "../utils/prismaClient";

import { SALT_ROUNDS, SIGN_KEY, TOKEN_EXPIRE_TIME } from "../utils/config";
import { User } from "@prisma/client";
import { NotFoundError } from "@prisma/client/runtime";


const authRouter = Router()

authRouter.post('/login', async (request, response) => {
    const { email, password } = request.body
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
        return response
            .status(401)
            .send({ error: "invalidUsername" })
    }
    const passwordMatch = await bcrypt.compare(password, user.passwordHash)

    if (!passwordMatch) {
        return response
            .status(401)
            .send({ error: 'invalidPassword' })
    }

    const authTokens = await prisma.authToken.findMany({ where: { userId: user.id }, select: { id: true, createDate: true, lastUseDate: true } })
    if (authTokens.length >= 2) {
        return response.status(httpStatus.UNPROCESSABLE_ENTITY).send({ error: 'tooManyTokens', revokeToken: authTokens })
    }
    const authToken = await createToken(user, request)

    response
        .status(200)
        .send({ token: authToken, username: user.email, name: user.name })
})

authRouter.post('/revoke', async (request, response) => {
    const { token_id: tokenId, email, password } = request.body

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
        return response
            .status(401)
            .send({ error: "invalidUsername" })
    }
    const passwordMatch = await bcrypt.compare(password, user.passwordHash)

    if (!passwordMatch) {
        return response
            .status(401)
            .send({ error: 'invalidPassword' })
    }
    try {
        const token = await prisma.authToken.findFirstOrThrow({
            where: {
                id: tokenId,
                userId: user.id
            }
        })
        await prisma.authToken.delete({ where: { id: token.id } })
        response.status(200).send({ message: `Token created at ${token.createDate} revoked` })

    } catch (e) {
        if (e instanceof NotFoundError) {
            return response.status(httpStatus.UNPROCESSABLE_ENTITY).send({ error: 'Could not find token' })
        }
        throw e
    }

})

authRouter.post('/signup', async (request, response) => {
    const { email, password, name } = request.body
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await prisma.user.create({
        data: {
            email,
            name,
            passwordHash
        }
    })

    const authToken = await createToken(user, request)

    response
        .status(200)
        .send({ authToken, username: user.email, name: user.name })
})

async function createToken(user: User, request: Request) {
    const tokenPayload = {
        email: user.email,
        id: user.id,
        name: user.name,
    }

    const authToken = jwt.sign(tokenPayload, SIGN_KEY, { expiresIn: TOKEN_EXPIRE_TIME })
    await prisma.authToken.create({
        data: {
            token: authToken,
            ip: request.ip,
            userId: user.id,
        }
    })
    return authToken
}
export default authRouter
