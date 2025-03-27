# nvm 設定
export NVM_DIR="$HOME/.nvm"

# nvm をロード
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

# ディレクトリ変更時に .nvmrc または .node-version を自動的に適用する関数
autoload -U add-zsh-hook

load-nvmrc() {
  local node_version="$(nvm version)"
  local nvmrc_path="$(nvm_find_nvmrc)"
  local node_version_path=".node-version"

  # .nvmrc ファイルがある場合
  if [ -n "$nvmrc_path" ]; then
    local nvmrc_node_version
    nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")

    if [ "$nvmrc_node_version" = "N/A" ]; then
      nvm install
    elif [ "$nvmrc_node_version" != "$node_version" ]; then
      nvm use
    fi

  # .node-version ファイルがある場合
  elif [ -f "$node_version_path" ]; then
    local node_version_node_version
    node_version_node_version=$(nvm version "$(cat "${node_version_path}")")

    if [ "$node_version_node_version" = "N/A" ]; then
      nvm install "$(cat "${node_version_path}")"
    elif [ "$node_version_node_version" != "$node_version" ]; then
      nvm use "$(cat "${node_version_path}")"
    fi

  # どちらのファイルもない場合はデフォルトに戻す
  elif [ "$node_version" != "$(nvm version default)" ]; then
    nvm use default
  fi
}

# ディレクトリ変更時に load-nvmrc を実行
add-zsh-hook chpwd load-nvmrc
load-nvmrc
