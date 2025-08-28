#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Define an array of models
models=("Aire" "Constitucion" "DefensaNacional" "Minsdef" "Pdc")

# Loop through the models and run the import script
for model in "${models[@]}"
do
  # Construct the file path based on the model name
  # Note: This assumes the file names are consistent with model names (case-insensitive for some filesystems)
  file_path=""
  if [ "$model" == "Constitucion" ]; then
    file_path="scripts/data/constitucion.c"
  elif [ "$model" == "DefensaNacional" ]; then
    file_path="scripts/data/defensa_nacional.c"
  else
    file_path="scripts/data/${model}.c"
  fi
  
  echo "-----------------------------------------------------"
  echo "Importing data for model: $model from $file_path"
  echo "-----------------------------------------------------"
  
  # Run the import script
  npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/import-questions.ts "$model" "$file_path"
  
  echo "Finished importing data for model: $model"
done

echo "====================================================="
echo "All data import tasks have been completed."
echo "=====================================================" 