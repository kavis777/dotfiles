# homebrewの設定
set -gx HOMEBREW_PREFIX "/opt/homebrew";
set -gx HOMEBREW_CELLAR "/opt/homebrew/Cellar";
set -gx HOMEBREW_REPOSITORY "/opt/homebrew";
set -gx HOMEBREW_SHELLENV_PREFIX "/opt/homebrew";
set -q PATH; or set PATH ''; set -gx PATH "/opt/homebrew/bin" "/opt/homebrew/sbin" $PATH;
set -q MANPATH; or set MANPATH ''; set -gx MANPATH "/opt/homebrew/share/man" $MANPATH;
set -q INFOPATH; or set INFOPATH ''; set -gx INFOPATH "/opt/homebrew/share/info" $INFOPATH;

# nodenvの設定
status --is-interactive; and source (nodenv init -|psub)

# rbenvの設定
status --is-interactive; and source (rbenv init -|psub)

# yvmの設定
set -x YVM_DIR 〜/.yvm
[ -r $YVM_DIR/yvm.fish ]; and source $YVM_DIR/yvm.fish
