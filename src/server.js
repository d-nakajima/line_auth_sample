const express = require("express")
const bodyParser = require("body-parser")
const fetch = require("node-fetch")
const jwt = require('jsonwebtoken');
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3030
const JWT_ALGORITHM = "RS256"

app.use(bodyParser.json())

const verify = (token) => {
  return fetch('https://' + process.env.LINE_AUTH_DOMAIN + '/oauth2/v2.1/verify?access_token=' + token)
       .then(response => response.json())
}

const getProfileInfo = (token) => {
   const headers = { Authorization: `Bearer ${token}` }
   return fetch('https://' + process.env.LINE_AUTH_DOMAIN + '/v2/profile', { headers })
       .then(response => response.json())
}

const USER_FETCH_OPERATION = `
query ($lineId: String!) {
  user(where: { Line_id: { _eq: $lineId } }) {
    user_id
  }
}
`

const fetchUser = async ({ lineId }) => {
  const variables = { lineId: lineId }

  const response = await fetch(
    `${process.env.HASURA_HOST}/v1/graphql`,
    {
      method: 'POST',
      headers: { 'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET },
      body: JSON.stringify({
        query: USER_FETCH_OPERATION,
        variables,
      })
    }
  )
  const { data } = await response.json()
  return data
}

// Request Handler
app.post('/auth', async (req, res) => {
  console.log('start auth')
  const { lineId, accessToken } = req.body.input
  
  console.log('start verify')
  const { client_id: clientId, expires_in: expiresIn } = await verify(accessToken)
  console.log('finish verify')
  
  if (expiresIn <= 0) {
    console.log('token expired')
    return res.status(400).json({ message: "error happened" })
  }

  if (clientId !== process.env.LINE_CHANNEL_ID) {
    console.log(`invalid channel id.\nvalid: ${process.env.LINE_CHANNEL_ID},\nget: ${clientId}`)
    return res.status(400).json({ message: "error happened" })
  }

  console.log('start get profile')
  const response = await getProfileInfo(accessToken)
  console.log('finish get profile')

  if (!response) {
    return res.status(400).json({ message: "error happened" })
  }
  
  console.log('start fetch user')
  const { user } = await fetchUser({ lineId })
  console.log('finish fetch profile')

  const data = {
    name: "HaratTok JWT",
    expiresIn: "1h",
    "https://hasura.io/jwt/claims": {
      "x-hasura-allowed-roles": ["user"],
      "x-hasura-default-role": "user",
      "x-hasura-user-id": user.user_id,
    }
  }

  const token = jwt.sign(data, process.env.JWT_SECRET_KEY, { algorithm: JWT_ALGORITHM })
  return res.status(200).json({ sessionToken: token })
})

app.listen(PORT)