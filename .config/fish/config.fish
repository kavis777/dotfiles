# homebrewの設定
set BREW_DIR (which brew)
status --is-interactive; and source ($BREW_DIR shellenv|psub)

# nodenvの設定
status --is-interactive; and source (nodenv init -|psub)

# rbenvの設定
status --is-interactive; and source (rbenv init -|psub)

# yvmの設定
set -x YVM_DIR 〜/.yvm
[ -r $YVM_DIR/yvm.fish ]; and source $YVM_DIR/yvm.fish
