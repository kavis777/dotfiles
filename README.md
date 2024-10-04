## はじめに

このリポジトリでは設定ファイルの管理を行う。
セットアップは以下のリポジトリで行う。
https://github.com/kavis777/mac-init-setup

## 現在の設定を dotfiles への移行する手順

dotfiles はすでにホームディレクトリに存在するものとする。

1. まずは設定を dotfiles で管理したいファイルを dotfiles にコピーする。

例）

```
mv ~/.bash_profile ~/dotfiles
```

2. 元々ファイルがあった場所に dotfiles に移動したファイルのシンボリックリンクを作成する。

```
ln -s ~/dotfiles/.bash_profile ~
```

3. dotfiles リポジトリの変更をコミットして push したら完了です。
