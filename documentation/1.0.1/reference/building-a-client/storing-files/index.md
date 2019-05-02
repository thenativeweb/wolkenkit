# Storing files

Usually commands and events only contain data, but sometimes it may be necessary to store files as well.

Since commands and events are meant for storing data, the size of their payload is limited to 100kb. This is a problem if you need to store binary data such as images or videos as part of them.

For that, wolkenkit automatically provides an external blob server that you can use to upload and retrieve arbitrarily large files. Anyway, it is up to you to integrate this service into your application.

## Uploading files

To upload a file, send a `POST` request to the blob server and provide the binary data within the request's body. The blob server will automatically detect the correct mime type of the data.

E.g., to upload a file to the blob server, use the following code:

```javascript
const blobStorageEndpoint = 'https://local.wolkenkit.io:3001/';

const upload = function (data) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open('POST', blobStorageEndpoint, true);

    request.onload = () => {
      if (request.status !== 200) {
        return reject(new Error('Upload failed.'));
      }

      const uploadId = JSON.parse(request.responseText).id;
      // E.g., 'a548c188-0d13-47dd-8b25-9b1ef26a86a9'

      resolve(uploadId);
    };

    request.send(data);  
  });
}
```

To transform files, e.g. from a form, into a JavaScript object, you need to use the `FileReader` class. For details on how to use this see [Reading files in JavaScript using the File APIs](https://www.html5rocks.com/en/tutorials/file/dndfiles/).

Please make sure that you use its `readAsArrayBuffer` function to get the file into a format the `upload` function and the blob server do understand.

## Retrieving files

To retrieve a previously uploaded file, send a `GET` request to the blob server and provide the file's id as path. If the file does exist, the blob server sends its content as response, otherwise it returns a `404` status code.

E.g., to retrieve a previously uploaded image by its id, use the following code:

```html
<img src="https://local.wolkenkit.io:3001/a548c188-0d13-47dd-8b25-9b1ef26a86a9" />
```

## Integrating uploads with commands

To upload a file that you want to refer from within a command, first upload the file and then reference its id in your command's data.

E.g., to store a scan of an invoice when issuing it, use the following code:

```javascript
const issueInvoice = function (invoiceId, amount, recipient, scan) {
  upload(scan).then(scanId => {
    financialservices.accounting.invoice(invoiceId).issue({
      amount,
      recipient,
      scanId
    });
  }).catch(err => {
    // ...
  });
};
```
