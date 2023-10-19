let buffer,mediaRecorder;
let videoElement=document.getElementsByTagName('video')[0];
function startRecord(){
buffer=[];
let options={
    mimeType: 'video/webm'
}
if(! MediaRecorder.isTypeSupported(options.mimeType)){
    console.error(`${options.mimeType} is not supported`);
    return;
}
try{
    const capStream=videoElement.captureStream();
    let stream=new MediaStream()
    if(videoElement.muted||!videoElement.volume){
        capStream.getVideoTracks().map(track=>stream.addTrack(track));
    }else{
        capStream.getTracks().map(track=>stream.addTrack(track));
    }
    mediaRecorder = new MediaRecorder(stream,options);
    mediaRecorder.start();
    mediaRecorder.ondataavailable=handleDataAvailable;
    videoElement.addEventListener('loadedmetadata', () => {
        mediaRecorder.start();
    });
}catch(error){
    console.error('failed to create mediaRecorder:',error)
}
}
function stopRecord(){
    mediaRecorder.stop()
}
function handleDataAvailable(e){
    if(e&&e.data&&e.data.size>0){
        buffer.push(e.data)
    }
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