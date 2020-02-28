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


