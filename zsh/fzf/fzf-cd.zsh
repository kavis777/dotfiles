#
# fzf-cd.zsh
#
# ABOUT:
#   `cd` to `ghq` repositories directory on `zsh`
#   You can launch this function with `Ctrl-g`
#
# INSTALLATION:
#   Requires `zsh` and `fzf`
#   Download this file then, append `source path/to/fzf-ghq.zsh` to your `~/.zshrc`
#   or copy & paste to your `~/.zshrc`
# 

function _fzf_cd() {
    local destination="$(echo "$(ghq list --full-path)\n$(echo $HOME)/dotfiles" | fzf)"
    [ -n "${destination}" ] && cd "${destination}"
    zle accept-line
    zle reset-prompt
}

zle -N _fzf_cd
bindkey "^g" _fzf_cd

