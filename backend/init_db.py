from pathlib import Path

from dotenv import load_dotenv

from main import SCHEMA_PATH, get_connection


def main() -> None:
    load_dotenv(Path(__file__).with_name(".env"))
    with get_connection() as connection:
        connection.execute(SCHEMA_PATH.read_text(encoding="utf-8"))
        connection.commit()
    print("Database schema initialized without sample data")


if __name__ == "__main__":
    main()
