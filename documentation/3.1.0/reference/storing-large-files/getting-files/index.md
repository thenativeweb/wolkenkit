# Getting files

To get a file, call the `getFile` function of the depot SDK and pass the file ID as parameter. This returns an object that contains the file and its file name and content type. In Node.js the content is returned as a stream, in the browser it is returned as an instance of `Blob`:

```javascript
const { content, contentType, fileName } = await depotClient.getFile({
  id: '2a7e9f8f-9bfc-4c19-87b9-274c0e193401'
});
```

In the browser there are different ways to process the content: For example, you can use the `FileReader` class to read the content or convert it to a data url. For details on how to use this see [Reading files in JavaScript using the File APIs](https://www.html5rocks.com/en/tutorials/file/dndfiles/).

To read the content into an array, use the following code:

```javascript
const { content, fileName, contentType } = await depotClient.getFile({
  id: '2a7e9f8f-9bfc-4c19-87b9-274c0e193401'
});

const reader = new FileReader();

reader.addEventListener('loadend', () => {
  // result is an instance of ArrayBuffer.
  console.log(reader.result);
});

reader.readAsArrayBuffer(content);
```

## Using data urls

To convert a file to a data url, use the `asDataUrl` function with the result of the call to the `getFile` function:

```javascript
const file = await depotClient.getFile({
  id: '2a7e9f8f-9bfc-4c19-87b9-274c0e193401'
});

const dataUrl = await file.asDataUrl();
```

### Displaying images

You can use a data url, for example, to easily display images (supposed that the file your retrieved actually contains an image):

```javascript
const image = new Image();

image.src = dataUrl;

document.body.appendChild(image);
```

## Using the HTTP API

To get a file using the HTTP API, call the route `GET /api/v1/file/:id` and provide the file ID as part of the path.

To authenticate your request, proceed as described in [accessing file storage](../accessing-file-storage/#using-the-http-api).

If the file was successfully read, you will receive the status code `200` and the file in the response body. The content type is provided in the `content-type` header. The file ID and its file name are sent in the `x-metadata` header as a stringified JSON object with the following structure:

```json
{
  "id": "2a7e9f8f-9bfc-4c19-87b9-274c0e193401",
  "contentType": "image/png",
  "fileName": "wolkenkit.png"
}
```

In case of errors, you will receive one of the following error codes:

- `401 (Unauthorized)`
- `404 (Not found)`
- `500 (Internal server error)`
