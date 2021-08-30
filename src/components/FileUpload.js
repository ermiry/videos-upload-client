import React, { Fragment, useEffect, useState } from 'react';

import axios from "axios";
import { v4 as uuidv4 } from 'uuid';

import Message from './Message';
import Progress from './Progress';

const chunkSize = 1048576 * 4;

const FileUpload = () => {
  const [showProgress, setShowProgress] = useState (false);
  const [counter, setCounter] = useState (1);
  const [fileToBeUpload, setFileToBeUpload] = useState ({});
  const [beginingOfTheChunk, setBeginingOfTheChunk] = useState (0);
  const [endOfTheChunk, setEndOfTheChunk] = useState (chunkSize);
  const [progress, setProgress] = useState (0);
  const [fileGuid, setFileGuid] = useState ("");
  const [fileSize, setFileSize] = useState (0);
  const [chunkCount, setChunkCount] = useState (0);

  const [uploading, setUploading] = useState (false);
  const [uploadedFile, setUploadedFile] = useState ({});
  const [message, setMessage] = useState ('');
  const [uploadPercentage, setUploadPercentage] = useState (0);

  useEffect(() => {
    console.log ("hola")
    // console.log (fileSize)
    if ((fileSize > 0) && uploading) {
      fileUpload(counter);
    }
  }, [fileToBeUpload, uploading, progress])

  const getFileContext = (e) => {
    resetChunkProperties();
    const _file = e.target.files[0];
    setFileSize(_file.size)

    const _totalCount = _file.size % chunkSize === 0 ? _file.size / chunkSize : Math.floor(_file.size / chunkSize) + 1; // Total count of chunks will have been upload to finish the file
    setChunkCount(_totalCount)

    setFileToBeUpload(_file)
    const _fileID = uuidv4() + "." + _file.name.split('.').pop();
    setFileGuid(_fileID)

    console.log (_totalCount);
  }

  const fileUpload = () => {
    console.log ("fileUpload");
    console.log (counter);
    
    if (counter <= chunkCount) {
      setCounter(counter + 1);
      var chunk = fileToBeUpload.slice(beginingOfTheChunk, endOfTheChunk);
      uploadChunk(chunk)
    }
  }

  const uploadCreated = async e => {
    e.preventDefault();
    var form_data = new FormData();
    form_data.append ('filename', fileGuid);

    const response = await axios ({
      method: "post",
      url: "/api/videos/create",
      headers: { 'Content-Type': 'multipart/form-data' },
      data: form_data
    });

    const data = response.data;
    if (data.oki === "doki") {
      // start uploading chunks
      console.log ("Starting upload!");
      setUploading (true);
      // fileUpload ();
    }
  }

  const uploadChunk = async (chunk) => {
    console.log ("Uploading chunk...");
    try {
      var form_data = new FormData ();
      form_data.append ("id", counter);
      form_data.append ("filename", fileGuid);
      form_data.append ("chunk", chunk);

      const response = await axios ({
        method: "post",
        url: "/api/videos/upload",
        headers: { 'Content-Type': 'multipart/form-data' },
        data: form_data
      });

      const data = response.data;
      if (data.oki === "doki") {
        console.log (endOfTheChunk);
        setBeginingOfTheChunk(endOfTheChunk);
        setEndOfTheChunk(endOfTheChunk + chunkSize);
        if (counter === chunkCount) {
          console.log('Process is complete, counter', counter)

          await uploadCompleted();
        } else {
          var percentage = (counter / chunkCount) * 100;
          setUploadPercentage (parseInt (Math.round (percentage)));
          setProgress(percentage);
          setUploading (true);
        }
      } else {
        console.log('Error Occurred:', data.errorMessage)
      }

    } catch (error) {
      debugger
      console.log('error', error)
    }
  }

  const uploadCompleted = async () => {
    var form_data = new FormData();
    form_data.append ('filename', fileGuid);

    const response = await axios ({
      method: "post",
      url: "/api/videos/upload/complete",
      headers: { 'Content-Type': 'multipart/form-data' },
      data: form_data
    });

    const data = response.data;
    if (data.oki === "doki") {
      setUploadPercentage (100);
      setMessage ('File Uploaded');
      setUploadedFile (fileGuid);
      setUploading (false);
    }
  }

  const resetChunkProperties = () => {
    setShowProgress(true)
    setProgress(0)
    setCounter(1)
    setBeginingOfTheChunk(0)
    setEndOfTheChunk(chunkSize)
  }

  return (
    <Fragment>
      {message ? <Message msg={message} /> : null}
      <form onSubmit={uploadCreated}>
        <div className='custom-file mb-4'>
          <input
            type='file'
            className='custom-file-input'
            id='customFile'
            onChange={getFileContext}
          />
          <label className='custom-file-label' htmlFor='customFile'>
            {fileGuid}
          </label>
        </div>

        <Progress percentage={uploadPercentage} />

        <input
          type='submit'
          value='Upload'
          className='btn btn-primary btn-block mt-4'
        />
      </form>
      {uploadedFile ? (
        <div className='row mt-5'>
          <div className='col-md-6 m-auto'>
            <h3 className='text-center'>{uploadedFile.fileName}</h3>
            {/* <img style={{ width: '100%' }} src={uploadedFile.filePath} alt='' /> */}
          </div>
        </div>
      ) : null}
    </Fragment>
  );
}

export default FileUpload;
