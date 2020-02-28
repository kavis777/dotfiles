# 現在の設定をdotfilesへの移行方法

`~/.bash_profile`を置き換える場合の例
1. dotfilesをクローンする。

```
git clone https://github.com/kavis777/dotfiles.```

2. `~/.bash_profile`をdotfiles以下にコピーする。

```
mv ~/.bash_profile ~/dotfiles
```

3. dotfilesの`.bash_profile`にシンボリックリンクを貼る。

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
