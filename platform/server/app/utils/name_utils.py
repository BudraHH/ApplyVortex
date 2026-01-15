"""
Utility functions for name parsing and formatting.
"""

def split_full_name(full_name: str) -> dict[str, str]:
    """
    Split a full name into first_name, middle_name, and last_name.
    
    Examples:
        "John Doe" -> {"first_name": "John", "middle_name": None, "last_name": "Doe"}
        "John Michael Doe" -> {"first_name": "John", "middle_name": "Michael", "last_name": "Doe"}
        "John" -> {"first_name": "John", "middle_name": None, "last_name": "John"}
        "John Paul George Ringo" -> {"first_name": "John", "middle_name": "Paul George", "last_name": "Ringo"}
    
    Args:
        full_name: The full name string to split
        
    Returns:
        Dictionary with first_name, middle_name, and last_name keys
    """
    # Clean and split the name
    parts = full_name.strip().split()
    
    if len(parts) == 0:
        # Empty name - use placeholder
        return {
            "first_name": "User",
            "middle_name": None,
            "last_name": "User"
        }
    elif len(parts) == 1:
        # Single name - use as both first and last
        return {
            "first_name": parts[0],
            "middle_name": None,
            "last_name": parts[0]
        }
    elif len(parts) == 2:
        # First and last name only
        return {
            "first_name": parts[0],
            "middle_name": None,
            "last_name": parts[1]
        }
    else:
        # Three or more parts: first, middle(s), last
        return {
            "first_name": parts[0],
            "middle_name": " ".join(parts[1:-1]),
            "last_name": parts[-1]
        }


def format_full_name(first_name: str, middle_name: str | None, last_name: str) -> str:
    """
    Format separate name parts into a full name.
    
    Args:
        first_name: First name
        middle_name: Middle name (optional)
        last_name: Last name
        
    Returns:
        Formatted full name string
    """
    parts = [first_name]
    if middle_name:
        parts.append(middle_name)
    parts.append(last_name)
    return " ".join(parts)
