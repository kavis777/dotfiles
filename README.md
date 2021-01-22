## はじめに

セットアップは以下のリポジトリで行う。
https://github.com/kavis777/mac-init-setup

## 現在の設定をdotfilesへの移行するやり方（サンプル）

以下の手順は、~/.bash_profileを置き換える場合の例です。

1. dotfilesをクローンする。

```
git clone https://github.com/kavis777/dotfiles.git
```

2. ~/.bash_profileをdotfiles以下にコピーする。

```
mv ~/.bash_profile ~/dotfiles
```

3. dotfilesの.bash_profileにシンボリックリンクを貼る。

```
ln -s ~/dotfiles/.bash_profile ~
```

4. 変更をコミットしてpushしたら完了です。


# iTerm2 の設定を Dropbox で共有する

1. Dropbox に既存の設定を移動

```
mkdir -p ~/Dropbox/application/iTerm2
cp -rp ~/Library/Preferences/com.googlecode.iterm2.plist ~/Dropbox/application/iTerm2/com.googlecode.iterm2.plist
```

2. 既存の iTerm2 の設定を削除

```
rm ~/Library/Preferences/com.googlecode.iterm2.plist
```

3. Dropbox にコピーした設定に対しシンボリックリンクを張る

```
ln -s ~/Dropbox/application/iTerm2/com.googlecode.iterm2.plist ~/Library/Preferences/com.googlecode.iterm2.plist
```

4. 設定を再読込する (cfprefsd を再起動)

```
killall cfprefsd
```

# fishの導入手順

### fish shell のインストール

```
brew install fish
```

### ログインシェルの設定変更

```
sudo vi /etc/shells
```

```shell:/etc/shells
...
#最後の行に以下を追加
/usr/local/bin/fish
```

```
chsh -s /usr/local/bin/fish
```

### 設定ファイルのコピー
```
ln -s ~/dotfiles/.config/ ~
```

### powerline/fontsのインストール

```
git clone https://github.com/powerline/fonts.git
sh fonts/install.sh
rm -rf fonts
```

インストール完了後に使用しているターミナルのフォントをpowerlineに変更する。
