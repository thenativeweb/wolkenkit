# Removing files

To remove a file, call the `removeFile` function of the depot SDK and pass the file ID as parameter:

```javascript
await depotClient.removeFile({
  id: '2a7e9f8f-9bfc-4c19-87b9-274c0e193401'
});
```

## Using the HTTP API

To remove a file using the HTTP API, call the route `POST /api/v1/remove-file`.

For the file ID, set the `x-metadata` header to a stringified JSON object with the following structure:

```json
{
  "id": "2a7e9f8f-9bfc-4c19-87b9-274c0e193401"
}
```

To authenticate your request, proceed as described in [accessing file storage](../accessing-file-storage/#using-the-http-api).

If the file was successfully removed, you will receive the status code `200`. In case of errors, you will receive one of the following error codes:

- `400 (Bad request)`
- `401 (Unauthorized)`
- `404 (Not found)`
- `500 (Internal server error)`
