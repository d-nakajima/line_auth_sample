# nodejs-express

This is a starter kit for `nodejs` with `express`. To get started:

Firstly, [download the starter-kit](https://github.com/hasura/codegen-assets/raw/master/nodejs-express/nodejs-express.zip) and `cd` into it.

```
npm ci
npm start
```

## Development

### generate keys

1. run following commands
```
ssh-keygen -t rsa -b 4096 -m PEM
ssh-keygen -f secret.pem.pub -e -m pem > secret.pem.pub_
mv secret.pem.pub_ secret.pem.pub
```

2. move each keys to each server's env file.

public: put to hasura server as JWT_VERIFY_KEY
secret: put to line_auth server as JWT_ENCRYPT_KEY