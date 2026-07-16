import os
import glob

def fix_colors():
    files = glob.glob('frontend/src/**/*.tsx', recursive=True)
    for file in files:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace gray text classes with responsive foreground opacity classes
        content = content.replace('text-gray-300', 'text-foreground/80')
        content = content.replace('text-gray-400', 'text-foreground/60')
        content = content.replace('text-gray-500', 'text-foreground/50')
        
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)

if __name__ == "__main__":
    fix_colors()
    print("Fixed text colors!")
