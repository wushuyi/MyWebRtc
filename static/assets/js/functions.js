/* global alert, io, rtcPeerConnection */
var cache = {};
var $cache = {};
var dataCaceh = {};
var socket;
var rtcFn = {};
var rtcPeer;
var configuration;
(function($){
    'use strict';

    rtcFn.initRtcConf = function(){
        var conf = {
            bandwidth: { audio: 64, video: 512, data: 30 * 1000 * 1000 },
            //attachStream: MediaStream,
            //attachStreams: [MediaStream_1, MediaStream_2, MediaStream_3],

            //offerSDP: offerSDP_sent_from_offerer,

            onICE: function (candidate) {
                //console.log(arguments);
                socket.emit('reqIce', candidate);
            },
            onRemoteStream: function (stream) {
                console.log(arguments);
                rtcFn.onRemoteStream(stream);
            },
            onRemoteStreamEnded: function (stream) {
                console.log(arguments);
            },

            //onOfferSDP: function (offerSDP) {
            //    console.log(arguments);
            //},

            //onAnswerSDP: function (answerSDP) {
            //    console.log(arguments);
            //},

            onChannelMessage: function (event) {
                console.log(arguments);
            },
            onChannelOpened: function (_RTCDataChannel) {
                console.log(arguments);
                rtcFn.onPeerConn();
            }
        };
        return conf;
    };

    rtcFn.onPeerConn = function(){
        $cache.rtcHang.show();
        //$cache.rtcCall.off('click')
        //    .get(0)
        //    .disabled = true;
    };

    rtcFn.initEl = function(){
        $cache.contentBox = $('#contentBox');
        $cache.content = $('#content');
        $cache.contentBtn = $('#contentBtn');

        $cache.otherIdBox = $('#otherIdBox');
        $cache.selfId = $('#selfId');
        $cache.otherId = $('#otherId');
        $cache.otherIdBtn = $('#otherIdBtn');

        $cache.videoBox = $('#videoBox');
        $cache.localVideo = $('#localVideo');
        $cache.remoteVideo = $('#remoteVideo');

        $cache.rtcCltBox = $('#rtcCltBox');
        $cache.rtcCall = $('#rtcCall');
        $cache.rtcHang = $('#rtcHang');
    };

    rtcFn.initWsConn = function(callback){
        var defaultUrl = location.origin;
        $cache.content.val(defaultUrl);
        $cache.contentBtn.one('click', function(){
            var url;
            url = $cache.content.val();
            if(!url){
                alert('不能为空!');
                return false;
            }
            socket = io(url);
            callback(socket);
        });
    };

    rtcFn.fnSetOtherIdOk = function(){
        $cache.otherIdBtn
            .off('click')
            .get(0)
            .disabled = true;
        $cache.rtcCltBox.show();
    };

    rtcFn.initEvent = function(){
        $cache.otherIdBtn.one('click', function(){
            var otherId;
            otherId = $.trim($cache.otherId.val());
            if(otherId.length === 0){
                alert('不能为空!');
                return false;
            }
            socket.emit('reqSetOtherId', {
                id: otherId
            });
            rtcFn.fnSetOtherIdOk();
        });

        $cache.rtcCall.on('click', function(){
            if(rtcPeer && rtcPeer.peer && rtcPeer.peer.iceConnectionState !== 'closed'){
                return false;
            }
            rtcFn.call();
        });
        $cache.rtcHang.on('click', function(){
            rtcFn.hang();
        });
    };

    rtcFn.hang = function(isRemote){
        if(rtcPeer && rtcPeer.peer && rtcPeer.peer.iceConnectionState !== 'closed'){
            rtcPeer.peer.close();
        }
        if(!isRemote){
            socket.emit('reqClose');
        }
    };

    rtcFn.call = function(){
        rtcFn.hang();
        configuration = rtcFn.initRtcConf();
        configuration.attachStream = cache.localStream;
        configuration.onOfferSDP = function(offerSDP) {
            console.log(arguments);
            socket.emit('reqOffer', offerSDP);
        };
        rtcPeer = rtcPeerConnection(configuration);
    };

    rtcFn.onCall = function(sdp){
        configuration = rtcFn.initRtcConf();
        configuration.attachStream = cache.localStream;
        configuration.offerSDP = sdp;
        configuration.onAnswerSDP = function(answerSDP) {
            console.log(arguments);
            socket.emit('reqAnswer', answerSDP);
        };
        rtcPeer = rtcPeerConnection(configuration);
    };

    rtcFn.onWsContent = function(socket){
        socket.once('getId', function(e){
            socket.id = e.id;
            $cache.selfId.val(socket.id);
            dataCaceh.selfId = e.id;
        });

        socket.once('connect', function(){
            socket.emit('getId');
        });

        socket.on('resSetOtherId', function(e){
            $cache.otherId.val(e.id);
            rtcFn.fnSetOtherIdOk();
            dataCaceh.otherId = e.id;
        });

        socket.on('resOffer', function(e){
            rtcFn.onCall(e);
        });

        socket.on('resAnswer', function(e){
            rtcPeer.addAnswerSDP(e);
        });

        socket.on('resIce', function(e){
            rtcPeer.addICE(e);
        });
        socket.on('resClose', function(){
            rtcFn.hang(true);
        });
    };

    rtcFn.initMedia = function(callback){
        getUserMedia({
            onsuccess: function(stream){
                callback(stream);
            },
            onerror: function(){
                console.log(arguments);
            }
        });
    };

    rtcFn.onGetUserMediaSuccess = function(stream){
        $cache.contentBox.hide();
        $cache.otherIdBox.show();
        $cache.videoBox.show();
        cache.localMediaUrl = URL.createObjectURL(stream);
        $cache.localVideo.get(0).src =cache.localMediaUrl
        cache.localStream = stream;
        rtcFn.initEvent();
    };

    rtcFn.onRemoteStream = function(stream){
        if(cache.remoteMediaUrl){
            URL.revokeObjectURL(cache.remoteMediaUrl);
        }
        cache.remoteMediaUrl = URL.createObjectURL(stream);
        $cache.remoteVideo.get(0).src = cache.remoteMediaUrl;
    };

    $(document).ready(function(){
        rtcFn.initEl();
        rtcFn.initWsConn(function(socket){
            rtcFn.onWsContent(socket);
            rtcFn.initMedia(rtcFn.onGetUserMediaSuccess);
        });
    });
})(window.jQuery);