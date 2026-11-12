import logo from "../assets/logomaria.png";

function Nav() {
    return (
        <nav className="navbar">
            <img src={logo} alt="Logo" height="40" />
            <div className="phone-box">
                <div className="phone-label">
                    <span>📞</span>
                    <span>24/7</span>
                </div>
                <div className="phone-number">
                    <span>+91 63814 65863</span>
                </div>
            </div>
        </nav>
    )
}

export default Nav;