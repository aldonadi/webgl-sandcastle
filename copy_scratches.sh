#!/usr/bin/env bash
# Targets to manage
targets=(implementation_plan.md task.md walkthrough.md)

# Colors
GREEN='\e[32m'
RED='\e[31m'
BLUE='\e[34m'
NC='\e[0m' # No Color

# Delete mode: remove any existing target files from ./scratch
if [[ "$1" == "delete" ]]; then
  NUM_DELETED=0
  for fname in "${targets[@]}"; do
    file="./scratch/$fname"
    if [[ -f "$file" ]]; then
      rm -f "$file"
      echo -e "${GREEN}[+] Deleted ${fname} from scratch${NC}"
      NUM_DELETED=$((NUM_DELETED + 1))
    fi
  done
  if [[ "$NUM_DELETED" == "0" ]]; then
    echo -e "${BLUE}[*] No scratch were found, and subsequently, none deleted${NC}"
  fi
  exit 0
fi

# Find the most recently created directory inside ~/.gemini/antigravity/brain/
latest_dir=$(ls -td ~/.gemini/antigravity/brain/*/ 2>/dev/null | head -n1)
if [[ -z "$latest_dir" ]]; then
  echo -e "${RED}[-] No directories found in ~/.gemini/antigravity/brain/${NC}"
  exit 1
fi

# Ensure the scratch directory exists
mkdir -p ./scratch

for fname in "${targets[@]}"; do
  src_file="$latest_dir/$fname"
  dest_file="./scratch/$fname"

  # Skip if the source file does not exist
  if [[ ! -f "$src_file" ]]; then
    continue
  fi

  if [[ -f "$dest_file" ]]; then
    src_mtime=$(stat -c %Y "$src_file")
    dest_mtime=$(stat -c %Y "$dest_file")
    if ((src_mtime > dest_mtime)); then
      cp "$src_file" "$dest_file"
      echo -e "${GREEN}[+] Copied ${fname} into scratch: file was newer${NC}"
    else
      echo -e "${RED}[-] NOT copying ${fname}: file is older than scratch copy${NC}"
    fi
  else
    cp "$src_file" "$dest_file"
    echo -e "${GREEN}[+] Copied ${fname} into scratch: didn't already exist${NC}"
  fi
done
