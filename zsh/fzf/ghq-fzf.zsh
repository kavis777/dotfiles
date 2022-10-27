#
# ghq-fzf.zsh
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

function _fzf_cd_ghq() {
    local dir="$(ghq root)/$(ghq list | fzf)"
    [ -n "${dir}" ] && cd "${dir}"
    zle accept-line
    zle reset-prompt
}

zle -N _fzf_cd_ghq
bindkey "^g" _fzf_cd_ghq

