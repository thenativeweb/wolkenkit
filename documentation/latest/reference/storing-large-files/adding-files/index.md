# Adding files

To store a file, call the `addFile` function of the depot SDK and pass the content and the file name as parameters. In Node.js the content can be passed as a stream or a buffer, in the browser it can be an instance of `File` or `Blob`. Either way, the function then returns the ID of the stored file:

```javascript
const content = fs.createReadStream('wolkenkit.png');

const id = await depotClient.addFile({
  content,
  fileName: 'wolkenkit.png'
});
```

In the browser the same example looks like this:

```javascript
const fileInput = document.getElementById('file-input');

fileInput.addEventListener('change', async () => {
  const content = fileInput.files[0];

  const id = await depotClient.addFile({
    content,
    fileName: 'wolkenkit.png'
  });
});
```

## Setting the ID manually

Sometimes it may be necessary to set the ID manually. Therefore it is possible to pass the optional parameter `id` to the function `addFile`. Please note that the value of the `id` parameter must be a UUID:

```javascript
const id = await depotClient.addFile({
  id: 'f9b14a28-b64e-4c07-893b-3566472100b7',
  content,
  fileName: 'wolkenkit.png'
});
```

## Setting the content type

By default, files are stored with the content type `application/octet-stream`. To change this, set the `contentType` property to the desired value:

```javascript
const id = await depotClient.addFile({
  content,
  contentType: 'image/png',
  fileName: 'wolkenkit.png'
});
```

## Configuring authorization

Individual permissions for various actions can be configured for each file. To do this, you must use the `isAuthorized` property to pass an object that contains the desired permissions. If you only want to configure a few permissions, you can simply specify only selected sections.

If you do not configure permissions at all, the default values shown in the following example are used. They are set so that only the user who originally stored a file has access to it:

```javascript
const id = await depotClient.addFile({
  content,
  fileName: 'wolkenkit.png',
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

## Using the HTTP API

To add a file using the HTTP API, call the route `POST /api/v1/add-file`.

For the content, use the request body; for the id, the file name and, if necessary, the content type and permissions, set the `x-metadata` header to a stringified JSON object with the following structure:

```json
{
  "id": "4bb37f02-a734-4f7e-85dc-6f239bf1b44d",
  "contentType": "image/png",
  "fileName": "wolkenkit.png",
  "isAuthorized": {
    ...
  }
}
```

To authenticate your request, proceed as described in [accessing file storage](../accessing-file-storage/#using-the-http-api).

If the file was successfully added, you will receive the status code `200`. In case of errors, you will receive one of the following error codes:

- `400 (Bad request)`
- `401 (Unauthorized)`
- `409 (Conflict)`
- `500 (Internal server error)`
