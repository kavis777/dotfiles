-- 基本設定
vim.opt.number = true
vim.opt.cursorline = true
vim.opt.laststatus = 2
vim.opt.showmode = true
vim.opt.showcmd = true
vim.opt.wildmenu = true
vim.opt.termguicolors = true
vim.cmd("syntax on")

-- 検索
vim.opt.hlsearch = true
vim.opt.incsearch = true
vim.opt.ignorecase = true
vim.opt.smartcase = true

-- インデント
vim.opt.expandtab = true
vim.opt.tabstop = 2
vim.opt.shiftwidth = 2
vim.opt.autoindent = true

-- 表示
vim.opt.scrolloff = 5
vim.opt.signcolumn = "yes"
vim.opt.wrap = false

-- 自動改行しない
vim.opt.textwidth = 0

-- 画面分割の方向（新規ウィンドウを右/下に開く）
vim.opt.splitright = true
vim.opt.splitbelow = true

-- クリップボード
vim.opt.clipboard = "unnamed"

-- Ctrl-Cでもinsertleaveイベントを発火させる
vim.keymap.set("i", "<C-c>", "<Esc>")

-- lazy.nvim ブートストラップ
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.uv.fs_stat(lazypath) then
  vim.fn.system({
    "git", "clone", "--filter=blob:none",
    "https://github.com/folke/lazy.nvim.git",
    "--branch=stable",
    lazypath,
  })
end
vim.opt.rtp:prepend(lazypath)

-- プラグイン
require("lazy").setup({
  -- カラースキーム（VS Code Default Dark Modern風）
  {
    "Mofiqul/vscode.nvim",
    lazy = false,
    priority = 1000,
    config = function()
      require("vscode").setup({
        style = "dark",
        transparent = false,
      })
      vim.cmd("colorscheme vscode")
      -- Cursorと同じカーソル行ハイライト
      vim.api.nvim_set_hl(0, "CursorLine", { bg = "#1a2a3a" })
      vim.api.nvim_set_hl(0, "CursorLineNr", { fg = "#c6c6c6", bold = true })
    end,
  },

  -- ノーマルモードでIMEを英字に自動切替
  {
    "keaising/im-select.nvim",
    config = function()
      require("im_select").setup({
        default_im_select = "com.apple.keylayout.ABC",
        default_command = "im-select",
        set_default_events = { "VimEnter", "FocusGained", "InsertLeave", "CmdlineLeave" },
        set_previous_events = {},
      })
    end,
  },

  -- ファジーファインダー
  {
    "nvim-telescope/telescope.nvim",
    dependencies = { "nvim-lua/plenary.nvim" },
    keys = {
      { "<leader>ff", "<cmd>Telescope find_files<cr>" },
      { "<leader>fg", "<cmd>Telescope live_grep<cr>" },
      { "<leader>fb", "<cmd>Telescope buffers<cr>" },
    },
  },

  -- ファイラー
  {
    "stevearc/oil.nvim",
    keys = {
      { "-", "<cmd>Oil<cr>" },
    },
    opts = {
      keymaps = {
        ["gy"] = { "actions.copy_entry_path", desc = "Copy full path" },
      },
    },
  },

  -- シンタックスハイライト強化
  {
    "nvim-treesitter/nvim-treesitter",
    build = ":TSUpdate",
    config = function()
      require("nvim-treesitter").setup()
      vim.treesitter.language.add("typescript")
      vim.treesitter.language.add("tsx")
      vim.treesitter.language.add("javascript")
      vim.treesitter.language.add("ruby")
      vim.treesitter.language.add("lua")
      vim.treesitter.language.add("json")
      vim.treesitter.language.add("yaml")
      vim.treesitter.language.add("html")
      vim.treesitter.language.add("css")
      vim.treesitter.language.add("make")
      vim.treesitter.language.add("bash")
      vim.treesitter.language.add("markdown")
      vim.treesitter.language.add("vim")
      vim.treesitter.language.add("toml")
    end,
  },

  -- LSP 関連
  { "neovim/nvim-lspconfig" },
  { "mason-org/mason.nvim", opts = {} },
  {
    "mason-org/mason-lspconfig.nvim",
    dependencies = {
      "mason-org/mason.nvim",
      "neovim/nvim-lspconfig",
      "SmiteshP/nvim-navic",
    },
    config = function()
      require("mason-lspconfig").setup({
        ensure_installed = { "ts_ls", "lua_ls" },
      })

      vim.lsp.config("lua_ls", {
        settings = {
          Lua = {
            diagnostics = { globals = { "vim" } },
            workspace = { checkThirdParty = false },
            telemetry = { enable = false },
          },
        },
      })
    end,
  },

  -- パンくずリスト（breadcrumb）
  {
    "SmiteshP/nvim-navic",
    dependencies = { "neovim/nvim-lspconfig" },
    config = function()
      require("nvim-navic").setup({
        highlight = true,
        separator = " > ",
        depth_limit = 0,
        lsp = { auto_attach = true },
      })
      vim.o.winbar = "%{%v:lua.require'nvim-navic'.get_location()%}"
    end,
  },
})

-- LSPアタッチ時のキーマッピング・navic連携
-- vim.lsp.config("*")ではon_attachが確実に発火しないため、autocmdで設定
vim.api.nvim_create_autocmd("LspAttach", {
  callback = function(args)
    local bufnr = args.buf
    local client = vim.lsp.get_client_by_id(args.data.client_id)
    if client and client.server_capabilities.documentSymbolProvider then
      require("nvim-navic").attach(client, bufnr)
    end
    local opts = { buffer = bufnr, silent = true }
    vim.keymap.set("n", "K", vim.lsp.buf.hover, opts)
    vim.keymap.set("n", "gd", vim.lsp.buf.definition, opts)
    vim.keymap.set("n", "gD", vim.lsp.buf.declaration, opts)
    vim.keymap.set("n", "gi", vim.lsp.buf.implementation, opts)
    vim.keymap.set("n", "gr", vim.lsp.buf.references, opts)
    vim.keymap.set("n", "<leader>rn", vim.lsp.buf.rename, opts)
    vim.keymap.set("n", "<leader>ca", vim.lsp.buf.code_action, opts)
    vim.keymap.set("n", "[d", vim.diagnostic.goto_prev, opts)
    vim.keymap.set("n", "]d", vim.diagnostic.goto_next, opts)
  end,
})

