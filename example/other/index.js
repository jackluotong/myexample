// 创建 MutationObserver 实例
let videoElement=document.getElementsByTagName('video')[0];
    const observer = new MutationObserver(function(mutationsList) {
    for (let mutation of mutationsList) {
        // 检查新添加的节点
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(function(node) {
            if (node instanceof HTMLVideoElement) {
            // 处理新创建的 video 元素
            handleVideoCreation(node);
            videoElement=node;
            }
        });
        }
        
        // 检查被移除的节点
        if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
        mutation.removedNodes.forEach(function(node) {
            if (node instanceof HTMLVideoElement) {
            handleVideoDestruction(node);
            }
        });
        }
    }
    });
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
    function save(){
        var blob =new Blob(buffer,{type:'video/mp4'});
        var url=window.URL.createObjectURL(blob);
        var a=document.createElement('a');
        a.href=url;
        a.style.display='none';
        a.download= `record.mp4`
        a.click()
    }
    function handleSrcChange(newSrc) {
        if (mediaRecorder) {
            stopRecording();
        }
        videoElement.src = newSrc;
        videoElement.addEventListener('loadedmetadata', startRecording);
    }

    // 配置 MutationObserver 监听的选项
    const observerConfig = { childList: true, subtree: true };

    // 监听整个文档树中节点的插入和删除
   

    // 处理新创建的 video 元素
    function handleVideoCreation(videoElement) {
        handleSrcChange(videoElement.src);
        console.log('New video element created:', videoElement);
    // 在这里可以执行相关操作
    }

    // 处理被移除的 video 元素
    function handleVideoDestruction(videoElement) {
    console.log('Video element destroyed:', videoElement);
    // 在这里可以执行相关操作
    }
 observer.observe(document.documentElement, observerConfig);