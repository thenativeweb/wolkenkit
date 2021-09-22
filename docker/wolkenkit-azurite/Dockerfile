FROM mcr.microsoft.com/azure-storage/azurite
LABEL maintainer="the native web <hello@thenativeweb.io>"

# Blob Storage Port
EXPOSE 10000
# Queue Storage Port
EXPOSE 10001
# Table Storage Port
EXPOSE 10002

CMD ["azurite", "-L", "-l", "/data", "--blobHost", "0.0.0.0","--queueHost", "0.0.0.0", "--tableHost", "0.0.0.0"]
