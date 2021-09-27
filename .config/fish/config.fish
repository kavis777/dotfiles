# homebrewの設定
status --is-interactive; and source (/opt/homebrew/bin/brew shellenv|psub)

# nodenvの設定
status --is-interactive; and source (nodenv init -|psub)

# rbenvの設定
status --is-interactive; and source (rbenv init -|psub)

# yvmの設定
set -x YVM_DIR $HOME/.yvm
[ -r $YVM_DIR/yvm.fish ]; and source $YVM_DIR/yvm.fish
