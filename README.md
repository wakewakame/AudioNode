<img src="https://wakewakame.github.io/AudioNode/logo/audio_node_logo.svg" width="200"><br>  
<img src="https://wakewakame.github.io/AudioNode/logo/audio_node_logo_text.svg" width="200">  

# AudioNode
大学3年生のころに作成した、ブラウザ上で動作するノードベースの音声処理ソフトです。
様々なノードを画面に追加し、それらを繋げることでリアルタイムな音声処理を行えます。
また、入力波形や処理途中の波形、出力波形などもリアルタイムに可視化されます。

以下はバンドパスフィルターを実装した例です。
ノイズに対してバンドパス処理を行い、スピーカーから音を出力しています。

![demo](demo/demo.gif)

入力にはマイク、音声ファイル、MIDI入力、画像ファイルの4つに対応しています。
出力はスピーカーのみに対応しています。

# デモ
以下のURLから実際に体験することができます。

[https://wakewakame.github.io/AudioNode/dst/](https://wakewakame.github.io/AudioNode/dst/)  

# 仕組み
複雑な音声をリアルタイムに実行するため、音声処理はGPU上で行っています。
ブラウザからGPUの計算資源を利用するため、WebGLを利用しました。
そのため、音声波形はWebGLのテクスチャとして管理されています。
また、音声のフィルター処理はWebGLのフラグメントシェーダで行っています。

# ビルド

```bash
git clone https://github.com/wakewakame/AudioNode
cd AudioNode
git submodule update --init --recursive
npm install
npm run-script build
```

これにより`dst`ディレクトリに`main.js`が生成されます。

また、`npm run-script start`を実行した状態で`localhost:8080/dst`にアクセスするとプログラムが更新されるたびに自動的にブラウザがリロードしてくれます。

# 制作途中のツイート
[https://twitter.com/hu_123456/status/1175426469339656192](https://twitter.com/hu_123456/status/1175426469339656192)  
[https://twitter.com/hu_123456/status/1178240029987991553](https://twitter.com/hu_123456/status/1178240029987991553)  
[https://twitter.com/hu_123456/status/1184062148520992770](https://twitter.com/hu_123456/status/1184062148520992770)  
[https://twitter.com/hu_123456/status/1184454630194810880](https://twitter.com/hu_123456/status/1184454630194810880)  
[https://twitter.com/hu_123456/status/1184850474404499462](https://twitter.com/hu_123456/status/1184850474404499462)  
[https://twitter.com/hu_123456/status/1188499265036804096](https://twitter.com/hu_123456/status/1188499265036804096)  
[https://twitter.com/hu_123456/status/1199010136808808449](https://twitter.com/hu_123456/status/1199010136808808449)  
[https://twitter.com/hu_123456/status/1230670758730399744](https://twitter.com/hu_123456/status/1230670758730399744)  
[https://twitter.com/hu_123456/status/1230786726076923904](https://twitter.com/hu_123456/status/1230786726076923904)  
[https://twitter.com/hu_123456/status/1231370136386334720](https://twitter.com/hu_123456/status/1231370136386334720)  

# License
MIT
