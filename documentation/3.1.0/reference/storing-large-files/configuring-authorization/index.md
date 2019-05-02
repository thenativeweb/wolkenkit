# Configuring authorization

If you want to configure authorization for a file, there are basically two different approaches: First, you can transfer the ownership of a file; second, you can configure the access permissions for the users who try to access the file.

## Transferring the ownership

To transfer the ownership of a file, call the `transferOwnership` function of the depot SDK and pass the file ID as well as the ID of the new owner as parameters:

```javascript
await depotClient.transferOwnership({
  id: '2a7e9f8f-9bfc-4c19-87b9-274c0e193401',
  to: '9d0ad83b-865c-4684-b420-41f630118f1b'
});
```

:::hint-warning
> **Only known users**
>
> If you provide an id of a non-existent user, the ownership will be transferred anyway. You will not be able to return to the previous state.
:::

### Using the HTTP API

To transfer the ownership of a file using the HTTP API, call the route `POST /api/v1/transfer-ownership`.

For the file ID, set the `x-metadata` header to a stringified JSON object with the following structure:

```json
{
  "id": "2a7e9f8f-9bfc-4c19-87b9-274c0e193401"
}
```

For the ID of the new owner, set the `x-to` header to a stringified JSON object with the following structure:

```json
{
  "to": "9d0ad83b-865c-4684-b420-41f630118f1b"
}
```

To authenticate your request, proceed as described in [accessing file storage](../accessing-file-storage/#using-the-http-api).

If the ownership of the file was successfully transferred, you will receive the status code `200`. In case of errors, you will receive one of the following error codes:

- `400 (Bad request)`
- `401 (Unauthorized)`
- `404 (Not found)`
- `500 (Internal server error)`

## Changing authorization

To change the authorization of a file, call the `authorize` function of the depot SDK and pass the file ID as well as an object that contains the desired permissions. If you only want to configure a few permissions, you can simply specify only selected sections:

```javascript
await depotClient.authorize({
  id: '2a7e9f8f-9bfc-4c19-87b9-274c0e193401',
  isAuthorized: {
    commands: {
      removeFile: { forAuthenticated: false, forPublic: false },
      transferOwnership: { forAuthenticated: false, forPublic: false },
      authorize: { forAuthenticated: false, forPublic: false }
    },
    queries: {
      getFile: { forAuthenticated: false, forPublic: false }
    }
  }
});
```

### Using the HTTP API

To change the authorization of a file using the HTTP API, call the route `POST /api/v1/authorize`.

For the file ID and the permissions, set the `x-metadata` header to a stringified JSON object with the following structure:

```json
{
  "id": "2a7e9f8f-9bfc-4c19-87b9-274c0e193401",
  "isAuthorized": {
    ...
  }
}
```

To authenticate your request, proceed as described in [accessing file storage](../accessing-file-storage/#using-the-http-api).

If the authorization of the file was successfully changed, you will receive the status code `200`. In case of errors, you will receive one of the following error codes:

- `400 (Bad request)`
- `401 (Unauthorized)`
- `404 (Not found)`
- `500 (Internal server error)`
