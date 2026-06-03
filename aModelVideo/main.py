import sys
import os
from PyQt5.QtWidgets import QApplication
from PyQt5.QtGui import QIcon

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ui import MainWindow

def main():
    app = QApplication(sys.argv)
    app.setApplicationName("AI视频生成工作流")
    app.setApplicationVersion("1.0.0")
    app.setStyle("Fusion")
    
    window = MainWindow()
    window.show()
    
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()
