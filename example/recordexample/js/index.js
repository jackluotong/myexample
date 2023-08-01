let videoElement = document.getElementsByTagName('video');
      let mediaRecorder = null;
      let mediaStream = null;
      let buffer;
      function startRecording() {
        mediaStream = videoElement.captureStream();
        mediaRecorder = new MediaRecorder(mediaStream);
        mediaRecorder.addEventListener('dataavailable', handleDataAvailable);

        mediaRecorder.start();
      }
      function stopRecording() {
        mediaRecorder.stop();
        mediaRecorder.removeEventListener('dataavailable', handleDataAvailable);
        mediaRecorder = null;
        mediaStream = null;
      }
      function handleDataAvailable(event) {
        buffer.push(event.data);
      }

      function handleSrcChange(newSrc) {
        if (mediaRecorder) {
          stopRecording();
        }
        videoElement.src = newSrc;
        videoElement.addEventListener('loadedmetadata', startRecording);
      }

      function save() {
        var blob = new Blob(buffer, { type: 'video/mp4' });
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.style.display = 'none';
        a.download = `record.mp4`;
        a.click();
      }
      const observer = new MutationObserver(mutationsList => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'childList') {
            for (const addedNode of mutation.addedNodes) {
              if (addedNode instanceof HTMLVideoElement) {
                console.log('Video元素已创建:', addedNode);
                // 执行你的逻辑操作
              }
            }

            for (const removedNode of mutation.removedNodes) {
              if (removedNode instanceof HTMLVideoElement) {
                console.log('Video元素已销毁:', removedNode);
                // 执行你的逻辑操作
              }
            }
          }
        }
      });

      // 配置 MutationObserver
      const config = { childList: true, subtree: true };

      // 启动监听
      let fa = document.getElementsByClassName('flv-wrap')[0];
      observer.observe(fa, config);