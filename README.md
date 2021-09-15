## はじめに

このリポジトリでは設定ファイルの管理を行う。
セットアップは以下のリポジトリで行う。
https://github.com/kavis777/mac-init-setup

## 現在の設定をdotfilesへの移行する手順

dotfilesはすでにホームディレクトリに存在するものとする。


1. まずは設定をdotfilesで管理したいファイルをdotfilesにコピーする。

例）
```
mv ~/.bash_profile ~/dotfiles
```

2. 元々ファイルがあった場所にdotfilesに移動したファイルのシンボリックリンクを作成する。

```
ln -s ~/dotfiles/.bash_profile ~
```

3. dotfilesリポジトリの変更をコミットしてpushしたら完了です。
