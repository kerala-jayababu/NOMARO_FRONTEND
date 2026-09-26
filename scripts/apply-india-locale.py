import os

ROOT = os.path.join(os.path.dirname(__file__), "..", "src")

REPLACEMENTS = [
    ('dateFormat="MM/dd/yyyy"', 'dateFormat="dd-MM-yyyy"'),
    ("dateFormat='MM/dd/yyyy'", "dateFormat='dd-MM-yyyy'"),
    ('dateFormat="MM-dd-yyyy"', 'dateFormat="dd-MM-yyyy"'),
    ('.format("MM/DD/YYYY")', '.format("DD-MM-YYYY")'),
    (".format('MM/DD/YYYY')", ".format('DD-MM-YYYY')"),
    ('.format("MM-DD-YYYY")', '.format("DD-MM-YYYY")'),
    (".format('MM-DD-YYYY')", ".format('DD-MM-YYYY')"),
    ('.format("MM-01-YYYY")', '.format("01-MM-YYYY")'),
    (".format('MM-01-YYYY')", ".format('01-MM-YYYY')"),
    ('.format("DD/MM/YYYY")', '.format("DD-MM-YYYY")'),
    (".format('DD/MM/YYYY')", ".format('DD-MM-YYYY')"),
    ('moment(validFrom, "MM-DD-YYYY")', 'moment(validFrom, "DD-MM-YYYY")'),
    ('Intl.NumberFormat("en-US"', 'Intl.NumberFormat("en-IN"'),
    ("Intl.NumberFormat('en-US'", "Intl.NumberFormat('en-IN'"),
    ('toLocaleDateString("en-US"', 'toLocaleDateString("en-IN"'),
    ("toLocaleDateString('en-US'", "toLocaleDateString('en-IN'"),
    ('toLocaleDateString("en-GB"', 'toLocaleDateString("en-IN"'),
    ('toLocaleString("en-US"', 'toLocaleString("en-IN"'),
    ("toLocaleString('en-US'", "toLocaleString('en-IN'"),
    ('toLocaleTimeString("en-US"', 'toLocaleTimeString("en-IN"'),
    ('Intl.DateTimeFormat("en-US"', 'Intl.DateTimeFormat("en-IN"'),
    ('toLocaleString(undefined,', 'toLocaleString("en-IN",'),
    ("G$", "₹"),
]

SKIP_DIRS = {"node_modules", ".git", "dist", "build"}


def should_skip(path):
    parts = set(path.split(os.sep))
    return bool(parts & SKIP_DIRS)


def main():
    changed_files = 0
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        if should_skip(dirpath):
            continue
        for name in filenames:
            if not name.endswith((".js", ".jsx", ".ts", ".tsx")):
                continue
            path = os.path.join(dirpath, name)
            with open(path, "r", encoding="utf-8") as f:
                original = f.read()
            updated = original
            for old, new in REPLACEMENTS:
                updated = updated.replace(old, new)
            if updated != original:
                with open(path, "w", encoding="utf-8", newline="\n") as f:
                    f.write(updated)
                changed_files += 1
                print(os.path.relpath(path, ROOT))
    print(f"Updated {changed_files} files")


if __name__ == "__main__":
    main()
